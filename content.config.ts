import { defineCollection, defineContentConfig } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    // Routable pages: content/index.md -> "/", content/about.md -> "/about", ...
    content: defineCollection({
      type: "page",
      source: {
        include: "**/*.md",
        exclude: ["partials/**"],
      },
    }),

    // Non-routable fragments rendered by <AppPartial>, e.g. the 404 body.
    // Nuxt Content v2 used a leading underscore (`_404.md`) for this; v3 has
    // no underscore convention, so they live in their own collection instead.
    partials: defineCollection({
      type: "page",
      source: "partials/**/*.md",
    }),
  },
});
