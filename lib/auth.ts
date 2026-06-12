import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/index";
import * as schema from "@/db/schema";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL as string, 
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: { 
        enabled: true, 
      }, 
      socialProviders: { 
        google: { 
            clientId: process.env.GOOGLE_CLIENT_ID as string, 
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            
             scope: [
              "openid",
              "email",
              "profile",

              "https://www.googleapis.com/auth/gmail.readonly",

              "https://www.googleapis.com/auth/calendar.readonly",
            ],

            accessType: "offline",
            prompt: "consent",
        },  
      }, 
});