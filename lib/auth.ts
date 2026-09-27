import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendVerificationEmail } from "./email";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        to: user.email,
        name: user.name ?? "",
        url,
      });
    },
  },
  user: {
    modelName: "User",
    fields: {
      image: "photoUrl",
    },
    additionalFields: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      phoneNumber: { type: "string", required: false },
      role: {
        type: "string",
        required: false,
        defaultValue: "rider",
        input: true,
      },
    },
  },
  session: {
    modelName: "Session",
  },
  account: {
    modelName: "Account",
  },
  verification: {
    modelName: "Verification",
  },
});
