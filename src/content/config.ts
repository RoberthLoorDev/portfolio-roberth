import { defineCollection, z } from 'astro:content'

const projectsCollection = defineCollection({
     schema: z.object({
          title: z.string(),
          date: z.string(),
          company: z.string(),
          description: z.string(),
          tags: z.array(
               z.object({
                    name: z.string(),
               })
          ),
          image: z.string(),
          buttonText: z.string(),
          buttonLink: z.string(),
          showRedirectButton: z.boolean(),
          achievements: z.array(z.string()),
          conclusion: z.string(),
          body: z.string(),
          footerImage: z.string(),
          footerCaption: z.string(),
     }),
})

export const collections = {
     projects: projectsCollection,
}
