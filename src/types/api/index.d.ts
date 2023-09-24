import { ApiKey } from "@prisma/client";
import { type ZodIssue } from "zod";

export interface CreateApiData {
  error: string | ZodIssue[];
  createdApiKey: ApiKey | null;
}

export interface RevokeApiData {
  error: string | ZodIssue[] | null;
  deletedApiKey: boolean;
}
