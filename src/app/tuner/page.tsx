import type { Metadata } from "next";
import { TunerClient } from "./tuner-client";

export const metadata: Metadata = {
  title: "Guitar tuner",
  description:
    "A precise chromatic guitar tuner that runs entirely in your browser. Nylon or steel, laptop or phone.",
};

export default async function TunerPage({
  searchParams,
}: {
  searchParams: Promise<{ intro?: string }>;
}) {
  // The intro only plays for people who found the note icon on the home page.
  const { intro } = await searchParams;
  return <TunerClient showIntro={intro === "1"} />;
}
