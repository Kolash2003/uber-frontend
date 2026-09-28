import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name ?? "",
        url,
      });
    },
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
      lastLat: { type: "number", required: false, input: false },
      lastLng: { type: "number", required: false, input: false },
      lastAddress: { type: "string", required: false, input: false },
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
