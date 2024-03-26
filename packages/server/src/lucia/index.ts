import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";
import { lucia } from "lucia";
import { hono } from "lucia/middleware";

const client = new PrismaClient();

export const auth = lucia({
  env: Bun.env.NODE_ENV, // "PROD" if deployed to HTTPS
  middleware: hono(),
  adapter: prisma(client),
  getUserAttributes: (databaseUser) => {
		return {
			username: databaseUser.username
		};
	}
});
export type Auth = typeof auth;