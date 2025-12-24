import {cookies} from "next/headers";
import {ApiError} from "./errors";

type FetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetchServer<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const cookieHeader = cookies().toString(); // 현재 요청의 쿠키

  const res = await fetch(`${process.env.API_BASE_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? {cookie: cookieHeader} : {}),
      ...(opts.headers ?? {}),
    },
    // 서버 fetch는 credentials 옵션이 의미 없고, cookie 헤더로 전달하는 게 확실
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store", // 필요하면 route별로 조정
  });

  const contentType = res.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
    throw new ApiError(`Request failed: ${res.status}`, res.status, data);
  }

  return data as T;
}
