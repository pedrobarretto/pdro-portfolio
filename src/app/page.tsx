import HomeClient from "@/app/home-client";
import { getAllThoughts } from "@/lib/thoughts";

export default function Home() {
  const thoughts = getAllThoughts();

  const thoughtsForHome =
    thoughts.length > 0
      ? thoughts.map((thought) => ({
          title: thought.title,
          description: thought.description,
          slug: thought.slug,
        }))
      : [
          {
            title: "Coming soon",
            description:
              "I'll share my thoughts on software, life, and everything in between.",
          },
        ];

  return <HomeClient thoughts={thoughtsForHome} />;
}
