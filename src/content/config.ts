import { defineCollection, z } from 'astro:content'

const projectsCollection = defineCollection({
     schema: z.object({
          title: z.string(),
          title_es: z.string().optional(),
          date: z.string(),
          company: z.string(),
          description: z.string(),
          description_es: z.string().optional(),
          tags: z.array(
               z.object({
                    name: z.any(),
               })
          ),
          image: z.string(),
          buttonText: z.string(),
          buttonText_es: z.string().optional(),
          buttonLink: z.string(),
          showRedirectButton: z.boolean(),
          achievements: z.array(z.string()),
          achievements_es: z.array(z.string()).optional(),
          conclusion: z.string(),
          conclusion_es: z.string().optional(),
          body: z.string(),
          body_es: z.string().optional(),
          footerImage: z.string(),
          footerCaption: z.string(),
          footerCaption_es: z.string().optional(),
     }),
})

export const collections = {
     projects: projectsCollection,
}
