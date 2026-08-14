export interface HttpResponse {
  status: number;
  body: unknown;
  headers: Record<string, string>;
  timeMs: number;
}

export async function send(_request: Request): Promise<HttpResponse> {
  throw new Error("not implemented");
}
