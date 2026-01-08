import type { Context } from "elysia";
import { Technology } from "../models/technology.schema";

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

    // Check if technology already exists
    const existingTech = await Technology.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (existingTech) {
      set.status = 400;
      return { message: "Technology already exists" };
    }

    const technology = await Technology.create({
      name,
      description,
      frameworks: frameworks || [],
    });

    return {
      message: "Technology created successfully",
      technology: {
        id: technology._id.toString(),
        name: technology.name,
        slug: technology.slug,
        description: technology.description,
        frameworks: technology.frameworks,
      },
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to create technology" };
  }
};


export const getAllTechnologiesController = async ({ set }: Context) => {
  try {
    const technologies = await Technology.find().sort({ name: 1 });

    return {
      message: "Technologies retrieved successfully",
      count: technologies.length,
      technologies: technologies.map((tech) => ({
        id: tech._id.toString(),
        name: tech.name,
        slug: tech.slug,
        description: tech.description,
        frameworks: tech.frameworks,
        frameworkCount: tech.frameworks.length,
        createdAt: tech.createdAt,
        updatedAt: tech.updatedAt,
      })),
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

    const technology = await Technology.findById(id);

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    return {
      message: "Technology retrieved successfully",
      technology: {
        id: technology._id.toString(),
        name: technology.name,
        slug: technology.slug,
        description: technology.description,
        frameworks: technology.frameworks,
        frameworkCount: technology.frameworks.length,
        createdAt: technology.createdAt,
        updatedAt: technology.updatedAt,
      },
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
  try {
    const { slug } = params;

    const technology = await Technology.findBySlug(slug!);

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    return {
      message: "Technology retrieved successfully",
      technology: {
        id: technology._id.toString(),
        name: technology.name,
        slug: technology.slug,
        description: technology.description,
        frameworks: technology.frameworks,
        frameworkCount: technology.frameworks.length,
        createdAt: technology.createdAt,
        updatedAt: technology.updatedAt,
      },
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

    const technology = await Technology.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    return {
      message: "Technology updated successfully",
      technology: {
        id: technology._id.toString(),
        name: technology.name,
        slug: technology.slug,
        description: technology.description,
        frameworks: technology.frameworks,
      },
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

    const technology = await Technology.findByIdAndDelete(id);

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    return {
      message: "Technology deleted successfully",
      technology: {
        id: technology._id.toString(),
        name: technology.name,
      },
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

    const technology = await Technology.findById(id);

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    await technology.addFramework(framework);

    return {
      message: "Framework added successfully",
      technology: {
        id: technology._id.toString(),
        name: technology.name,
        frameworks: technology.frameworks,
      },
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

    const technology = await Technology.findById(id);

    if (!technology) {
      set.status = 404;
      return { message: "Technology not found" };
    }

    await technology.removeFramework(framework);

    return {
      message: "Framework removed successfully",
      technology: {
        id: technology._id.toString(),
        name: technology.name,
        frameworks: technology.frameworks,
      },
    };
  } catch (error: any) {
    set.status = 500;
    return { message: error.message || "Failed to remove framework" };
  }
};
