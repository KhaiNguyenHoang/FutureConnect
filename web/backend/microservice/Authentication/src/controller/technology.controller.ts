import type { Context } from "elysia";
import { Technology } from "../models/technology.schema";
import redis from "../config/redis";
import { publishEvent } from "../config/rabbitmq";
import mongoose from "mongoose";

interface CreateTechnologyBody {
  name: string;
  description?: string;
  frameworks?: string[];
}

interface UpdateTechnologyBody {
  name?: string;
  description?: string;
  frameworks?: string[];
}

interface TechnologyContext {
  body: any;
  params: {
    id?: string;
    slug?: string;
  };
  set: {
    status?: number | string;
  };
}


export const createTechnologyController = async ({
  body,
  set,
}: Context & TechnologyContext) => {
  try {
    const { name, description, frameworks } = body as CreateTechnologyBody;

    if (!name) {
      set.status = 400;
      return { message: "Technology name is required" };
    }

    // Check if technology already exists (Cached check optimization could be done here but risky for unique constraint)
    const existingTech = await Technology.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingTech) {
      set.status = 400;
      return { message: "Technology already exists" };
    }

    const newId = new mongoose.Types.ObjectId();
    const slug = name.toLowerCase().replace(/ /g, "-"); // Simple slug gen for immediate cache

    const techData = {
      _id: newId,
      name,
      slug,
      description,
      frameworks: frameworks || [],
      frameworkCount: (frameworks || []).length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 1. Update Cache
    await redis.set(`technology:${newId}`, JSON.stringify(techData), "EX", 3600);
    await redis.del("technologies:all"); // Invalidate list cache

    // 2. Publish Event
    await publishEvent("user_updates", { // Reusing queue for simplicity
      event: "TECH_DB_UPDATE",
      data: {
        id: newId,
        type: "CREATE",
        data: { ...techData, _id: newId } // Mongo expects _id in create if provided, or let worker handle specific logic
      },
    });

    return {
      message: "Technology created successfully (queued)",
      technology: {
        id: newId.toString(),
        name,
        slug,
        description,
        frameworks: frameworks || []
      },
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to create technology" };
  }
};


export const getAllTechnologiesController = async ({ set }: Context) => {
  try {
    // Check Cache
    const cachedTechs = await redis.get("technologies:all");
    if (cachedTechs) {
      return {
        message: "Technologies retrieved successfully (cached)",
        count: JSON.parse(cachedTechs).length,
        technologies: JSON.parse(cachedTechs)
      };
    }

    const technologies = await Technology.find().sort({ name: 1 });

    const responseData = technologies.map((tech) => ({
      id: tech._id.toString(),
      name: tech.name,
      slug: tech.slug,
      description: tech.description,
      frameworks: tech.frameworks,
      frameworkCount: tech.frameworks.length,
      createdAt: tech.createdAt,
      updatedAt: tech.updatedAt,
    }));

    // Set Cache
    await redis.set("technologies:all", JSON.stringify(responseData), "EX", 3600);

    return {
      message: "Technologies retrieved successfully",
      count: technologies.length,
      technologies: responseData,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to retrieve technologies" };
  }
};


export const getTechnologyByIdController = async ({
  params,
  set,
}: Context & TechnologyContext) => {
  try {
    const { id } = params;

    const cachedTech = await redis.get(`technology:${id}`);
    if (cachedTech) {
      return {
        message: "Technology retrieved successfully (cached)",
        technology: JSON.parse(cachedTech)
      };
    }

    const technology = await Technology.findById(id);

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    const techResponse = {
      id: technology._id.toString(),
      name: technology.name,
      slug: technology.slug,
      description: technology.description,
      frameworks: technology.frameworks,
      frameworkCount: technology.frameworks.length,
      createdAt: technology.createdAt,
      updatedAt: technology.updatedAt,
    };

    await redis.set(`technology:${id}`, JSON.stringify(techResponse), "EX", 3600);

    return {
      message: "Technology retrieved successfully",
      technology: techResponse,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to retrieve technology" };
  }
};


export const getTechnologyBySlugController = async ({
  params,
  set,
}: Context & TechnologyContext) => {
  // Implementing cache by slug is tricky without a separate map or scan. 
  // For now, we hit DB or could start maintaining slug->id map in Redis.
  // Keeping simple DB hit for slug lookup -> then cache by ID if needed.
  try {
    const { slug } = params;

    const technology = await Technology.findBySlug(slug!);

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    // We can cache by ID for future use
    const techResponse = {
      id: technology._id.toString(),
      name: technology.name,
      slug: technology.slug,
      description: technology.description,
      frameworks: technology.frameworks,
      frameworkCount: technology.frameworks.length,
      createdAt: technology.createdAt,
      updatedAt: technology.updatedAt,
    };
    await redis.set(`technology:${technology._id}`, JSON.stringify(techResponse), "EX", 3600);

    return {
      message: "Technology retrieved successfully",
      technology: techResponse,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to retrieve technology" };
  }
};


export const updateTechnologyController = async ({
  params,
  body,
  set,
}: Context & TechnologyContext) => {
  try {
    const { id } = params;
    const updates = body as UpdateTechnologyBody;

    // 1. Update Cache
    const cachedTechStr = await redis.get(`technology:${id}`);
    let techData = cachedTechStr ? JSON.parse(cachedTechStr) : null;

    if (!techData) {
      // Fetch to ensure exists
      const tech = await Technology.findById(id).lean();
      if (!tech) {
        set.status = 404;
        return { message: "Technology not found" };
      }
      techData = { ...tech, id: tech._id.toString() };
    }

    techData = { ...techData, ...updates };
    await redis.set(`technology:${id}`, JSON.stringify(techData), "EX", 3600);
    await redis.del("technologies:all");

    // 2. Publish Event
    await publishEvent("user_updates", {
      event: "TECH_DB_UPDATE",
      data: {
        id,
        type: "UPDATE",
        data: updates
      }
    });

    return {
      message: "Technology updated successfully (queued)",
      technology: techData,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to update technology" };
  }
};


export const deleteTechnologyController = async ({
  params,
  set,
}: Context & TechnologyContext) => {
  try {
    const { id } = params;

    // 1. Invalidate Cache
    const cachedTech = await redis.get(`technology:${id}`);
    await redis.del(`technology:${id}`);
    await redis.del("technologies:all");

    // 2. Publish Event
    await publishEvent("user_updates", {
      event: "TECH_DB_UPDATE",
      data: {
        id,
        type: "DELETE",
        data: {}
      }
    });

    return {
      message: "Technology deleted successfully (queued)",
      technology: cachedTech ? JSON.parse(cachedTech) : { id }
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to delete technology" };
  }
};


export const addFrameworkController = async ({
  params,
  body,
  set,
}: Context & {
  params: { id: string };
  body: any;
  set: any;
}) => {
  try {
    const { id } = params;
    const { framework } = body;

    if (!framework) {
      set.status = 400;
      return { message: "Framework name is required" };
    }

    // 1. Update Cache
    const cachedTechStr = await redis.get(`technology:${id}`);
    let techData = cachedTechStr ? JSON.parse(cachedTechStr) : null;

    if (!techData) {
      const tech = await Technology.findById(id).lean();
      if (!tech) {
        set.status = 404;
        return { message: "Technology not found" };
      }
      techData = { ...tech, id: tech._id.toString() };
    }

    if (!techData.frameworks) techData.frameworks = [];
    if (!techData.frameworks.includes(framework)) {
      techData.frameworks.push(framework);
      techData.frameworkCount = (techData.frameworkCount || 0) + 1;
    }

    await redis.set(`technology:${id}`, JSON.stringify(techData), "EX", 3600);
    await redis.del("technologies:all");

    // 2. Publish Event
    await publishEvent("user_updates", {
      event: "TECH_DB_UPDATE",
      data: {
        id,
        type: "ADD_FRAMEWORK",
        data: { framework }
      }
    });

    return {
      message: "Framework added successfully (queued)",
      technology: techData,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to add framework" };
  }
};


export const removeFrameworkController = async ({
  params,
  body,
  set,
}: Context & {
  params: { id: string };
  body: any;
  set: any;
}) => {
  try {
    const { id } = params;
    const { framework } = body;

    if (!framework) {
      set.status = 400;
      return { message: "Framework name is required" };
    }

    // 1. Update Cache
    const cachedTechStr = await redis.get(`technology:${id}`);
    let techData = cachedTechStr ? JSON.parse(cachedTechStr) : null;

    if (!techData) {
      const tech = await Technology.findById(id).lean();
      if (!tech) {
        set.status = 404;
        return { message: "Technology not found" };
      }
      techData = { ...tech, id: tech._id.toString() };
    }

    if (techData.frameworks) {
      techData.frameworks = techData.frameworks.filter((f: string) => f !== framework);
      techData.frameworkCount = techData.frameworks.length;
    }

    await redis.set(`technology:${id}`, JSON.stringify(techData), "EX", 3600);
    await redis.del("technologies:all");

    // 2. Publish Event
    await publishEvent("user_updates", {
      event: "TECH_DB_UPDATE",
      data: {
        id,
        type: "REMOVE_FRAMEWORK",
        data: { framework }
      }
    });

    return {
      message: "Framework removed successfully (queued)",
      technology: techData,
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to remove framework" };
  }
};
