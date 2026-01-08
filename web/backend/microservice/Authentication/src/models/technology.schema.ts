import mongoose, { Document, Model } from "mongoose";

export interface ITechnology extends Document {
  name: string;
  slug: string;
  description?: string;
  frameworks: string[];
  createdAt: Date;
  updatedAt: Date;

  addFramework(framework: string): Promise<ITechnology>;
  removeFramework(framework: string): Promise<ITechnology>;
  hasFramework(framework: string): boolean;
}

interface ITechnologyModel extends Model<ITechnology> {
  findBySlug(slug: string): Promise<ITechnology | null>;
}

const TechnologySchema = new mongoose.Schema<ITechnology, ITechnologyModel>(
  {
    name: {
      type: String,
      required: [true, "Technology name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Technology name must be at least 2 characters"],
      maxlength: [50, "Technology name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    frameworks: {
      type: [String],
      default: [],
      validate: {
        validator: function (frameworks: string[]) {
          return frameworks.length === new Set(frameworks).size;
        },
        message: "Frameworks must be unique",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

TechnologySchema.index({ slug: 1 });
TechnologySchema.index({ name: 1 });

TechnologySchema.virtual("frameworkCount").get(function (this: ITechnology) {
  return this.frameworks.length;
});

TechnologySchema.pre("validate", function (this: ITechnology) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "") // Bỏ ký tự đặc biệt
      .replace(/\s+/g, "-") // Thay khoảng trắng bằng -
      .replace(/-+/g, "-") // Bỏ dấu - trùng lặp
      .replace(/^-|-$/g, ""); // Bỏ dấu - ở đầu/cuối
  }
});

TechnologySchema.pre("save", function (this: ITechnology) {
  if (this.isModified("frameworks")) {
    this.frameworks = this.frameworks
      .map((f) => f.trim().toLowerCase())
      .filter((f) => f.length > 0);
  }
});

TechnologySchema.methods.addFramework = async function (
  this: ITechnology,
  framework: string,
): Promise<ITechnology> {
  const normalizedFramework = framework.trim().toLowerCase();

  if (!this.frameworks.includes(normalizedFramework)) {
    this.frameworks.push(normalizedFramework);
    await this.save();
  }

  return this;
};

TechnologySchema.methods.removeFramework = async function (
  this: ITechnology,
  framework: string,
): Promise<ITechnology> {
  const normalizedFramework = framework.trim().toLowerCase();
  this.frameworks = this.frameworks.filter((f) => f !== normalizedFramework);
  await this.save();
  return this;
};

TechnologySchema.methods.hasFramework = function (
  this: ITechnology,
  framework: string,
): boolean {
  const normalizedFramework = framework.trim().toLowerCase();
  return this.frameworks.includes(normalizedFramework);
};

// Static Methods
TechnologySchema.statics.findBySlug = function (
  this: ITechnologyModel,
  slug: string,
): Promise<ITechnology | null> {
  return this.findOne({ slug: slug.toLowerCase() });
};

export const Technology = mongoose.model<ITechnology, ITechnologyModel>(
  "Technology",
  TechnologySchema,
);
