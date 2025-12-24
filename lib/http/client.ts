import {ApiError} from "@/lib/http/errors";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
}

export async function apiFetchClient<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-type": "application/json",
      ...(opts.headers ?? {})
    },
    credentials: "include",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status}`, res.status, data)
  }

  return data as T;
}