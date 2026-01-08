import mongoose, { Document, Model, Query } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  name?: string;
  bio?: string;
  dateOfBirth?: Date;
  avatar?: string;
  googleId?: string;
  githubId?: string;
  linkedinId?: string;
  social?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  technologies: Array<{
    tech: mongoose.Types.ObjectId;
    framework?: string;
    level: "beginner" | "intermediate" | "advanced";
    years?: number;
  }>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  softDelete(): Promise<IUser>;
  getTechnologiesByLevel(level: string): any[];
  getTotalYearsExperience(): number;
  hasTechnology(techId: string | mongoose.Types.ObjectId): boolean;
  getAge(): number;
  getMaxPossibleExperience(): number;
}

interface IUserModel extends Model<IUser> {
  findByTechnology(techSlug: string): Query<IUser[], IUser>;
  findByEmail(email: string): Query<IUser | null, IUser>;
}

const UserSchema = new mongoose.Schema<IUser, IUserModel>(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot be longer than 30 characters"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email is invalid"],
    },
    password: {
      type: String,
      select: false,
      minlength: [6, "Password must be at least 6 characters"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot be longer than 100 characters"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot be longer than 500 characters"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (v: Date) {
          const age = new Date().getFullYear() - new Date(v).getFullYear();
          return age >= 13 && age <= 120;
        },
        message: "You must be at least 13 years old",
      },
    },
    avatar: {
      type: String,
      default: function (this: IUser) {
        const name = this.name || this.username;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=200`;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },
    linkedinId: {
      type: String,
      unique: true,
      sparse: true,
    },
    social: {
      github: {
        type: String,
        validate: {
          validator: function (v: string) {
            return !v || /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
          },
          message: "GitHub URL not valid",
        },
      },
      linkedin: {
        type: String,
        validate: {
          validator: function (v: string) {
            return !v || /^https?:\/\/(www\.)?linkedin\.com\/.+/.test(v);
          },
          message: "LinkedIn URL not valid",
        },
      },
      twitter: {
        type: String,
        validate: {
          validator: function (v: string) {
            return !v || /^https?:\/\/(www\.)?(twitter|x)\.com\/.+/.test(v);
          },
          message: "Twitter URL not valid",
        },
      },
    },
    technologies: [
      {
        tech: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Technology",
          required: true,
        },
        framework: {
          type: String,
          trim: true,
        },
        level: {
          type: String,
          enum: {
            values: ["beginner", "intermediate", "advanced"],
            message: "{VALUE} not valid level",
          },
          default: "beginner",
        },
        years: {
          type: Number,
          min: [0, "Years of experience cannot be negative"],
          validate: {
            validator: function (this: IUser, v: number) {
              if (!v || !this.dateOfBirth) return true;

              // Tính tuổi của user
              const age =
                new Date().getFullYear() -
                new Date(this.dateOfBirth).getFullYear();

              // Giả sử người ta bắt đầu học từ 10 tuổi
              const maxPossibleYears = Math.max(0, age - 10);

              return v <= maxPossibleYears;
            },
            message: function (props: any) {
              const user = props.instance as IUser;
              if (!user.dateOfBirth) return "Date of birth is required";

              const age =
                new Date().getFullYear() -
                new Date(user.dateOfBirth).getFullYear();
              const maxYears = Math.max(0, age - 10);

              return `Years of experience (${props.value}) cannot exceed ${maxYears} years based on your age`;
            },
          },
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc: any, ret: any) {
        delete ret.password;
        delete ret.__v;
        delete ret.isDeleted;
        delete ret.deletedAt;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ "technologies.tech": 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ githubId: 1 }, { sparse: true });
UserSchema.index({ linkedinId: 1 }, { sparse: true });
UserSchema.index({ isDeleted: 1 });

// Virtuals
UserSchema.virtual("skillCount").get(function (this: IUser) {
  return this.technologies.length;
});

UserSchema.virtual("age").get(function (this: IUser) {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
});

// Middleware: Hash password
UserSchema.pre("save", async function (this: IUser) {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Middleware: Validate framework
UserSchema.pre("save", async function (this: IUser) {
  if (this.isModified("technologies")) {
    for (const techEntry of this.technologies) {
      if (techEntry.framework) {
        const tech = await mongoose
          .model("Technology")
          .findById(techEntry.tech);

        if (tech && !tech.frameworks.includes(techEntry.framework)) {
          throw new Error(
            `Framework '${techEntry.framework}' does not exist in ${tech.name}`,
          );
        }
      }
    }
  }
});

// Middleware: Auto-populate technologies
UserSchema.pre(/^find/, function (this: any) {
  if (this.options?.autopopulate !== false) {
    this.populate("technologies.tech");
  }
});

// Middleware: Exclude soft deleted users
UserSchema.pre(/^find/, function (this: any) {
  if (this.options?.includeDeleted !== true) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// Instance Methods
UserSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) {
    const user = await mongoose
      .model<IUser>("User")
      .findById(this._id)
      .select("+password");
    if (!user || !user.password) return false;
    return bcrypt.compare(candidatePassword, user.password);
  }
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.softDelete = async function (this: IUser): Promise<IUser> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

UserSchema.methods.getTechnologiesByLevel = function (
  this: IUser,
  level: string,
) {
  return this.technologies.filter((t) => t.level === level);
};

UserSchema.methods.getTotalYearsExperience = function (this: IUser): number {
  return this.technologies.reduce((sum, t) => sum + (t.years || 0), 0);
};

UserSchema.methods.hasTechnology = function (
  this: IUser,
  techId: string | mongoose.Types.ObjectId,
): boolean {
  return this.technologies.some((t) => t.tech.equals(techId));
};

UserSchema.methods.getAge = function (this: IUser): number {
  if (!this.dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

UserSchema.methods.getMaxPossibleExperience = function (this: IUser): number {
  if (!this.dateOfBirth) return 0;
  const age = this.getAge();
  // Giả sử bắt đầu học từ 10 tuổi
  return Math.max(0, age - 10);
};

// Static Methods
UserSchema.statics.findByTechnology = function (
  this: IUserModel,
  techSlug: string,
) {
  return this.find({ "technologies.tech": techSlug }).populate(
    "technologies.tech",
  );
};

UserSchema.statics.findByEmail = function (this: IUserModel, email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

export const User = mongoose.model<IUser, IUserModel>("User", UserSchema);
