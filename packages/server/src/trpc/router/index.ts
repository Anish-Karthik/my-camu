import { publicProcedure, router } from "./trpc";

const appRouter = router({
  greeting: publicProcedure.query(() => {
    return "Hello, World!";
  }),
});

// Export type router type signature, this is used by the client.
export type AppRouter = typeof appRouter;
