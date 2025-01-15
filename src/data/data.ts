import {
     project1capture,
     iconProject1,
     iconProject2,
     captureProject2,
     captureCodecolibri,
     codecolibriIcon,
} from '../assets/images'

export const projectsArray = [
     {
          title: 'codecolibri',
          tags: ['Astro', 'TypeScript', 'Tailwind', 'Vercel', 'EmailJS'],
          description: `Developed a modern and functional landing page for a newly established software development company, focusing on clear communication and brand identity representation.`,
          image: captureCodecolibri,
          icon: codecolibriIcon,
          link: '/projects/codecolibri-landing-page',
     },

     {
          title: 'Litelnk',
          tags: ['Vue', 'Express', 'MongoDB', 'Tailwind'],
          description: `Site created with the purpose of being able to generate shortened links. Reinforced my
                understanding of random link generation and redirection. Improved user experience with
                responsive design and in-browser storage.`,
          image: project1capture,
          icon: iconProject1,
          link: 'https://litelnk.vercel.app/',
     },

     {
          title: 'Bambuners cards',
          tags: ['React', 'Express', 'NextJS', 'Tailwind', 'MongoDB'],
          description:
               'This project has been developed for the streamer d0oppa, who requested a trading card management system for his followers.',
          image: captureProject2,
          icon: iconProject2,
          link: '/projects/streamer-card-management',
     },
]
