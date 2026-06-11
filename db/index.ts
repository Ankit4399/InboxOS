import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const conn = neon(process.env.DATABASE_URL!);

export const db = drizzle(conn, { schema });