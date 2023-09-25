import { cosineSimilarity } from "@/helpers/cosine-similarity";
import { withMethods } from "@/lib/api-middlewares/with-methods";
import { db } from "@/lib/db";
import { openai } from "@/lib/openai";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const reqSchema = z.object({
  text1: z.string().max(1000),
  text2: z.string().max(1000),
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = req.body as unknown;

  const apiKey = req.headers.authorization;
  if (!apiKey) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { text1, text2 } = reqSchema.parse(body);

    const validApiKey = await db.apiKey.findFirst({
      where: { key: apiKey, enabled: true },
    });

    if (!validApiKey) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const start = new Date();

    const embeddings = await Promise.all(
      [text1, text2].map(async (text) => {
        const res = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: text,
        });
        return res.data[0].embedding;
      })
    );

    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);

    const duration = new Date().getTime() - start.getTime();

    //persist request
    await db.apiRequest.create({
      data: {
        duration,
        method: req.method as string,
        path: req.url as string,
        status: 200,
        apiKeyId: validApiKey.id,
        usedApiKey: validApiKey.key,
      },
    });

    return res.status(200).json({ success: true, text1, text2, similarity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues });
    }
    console.log("openaitest", error);

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export default withMethods(["POST"], handler);
