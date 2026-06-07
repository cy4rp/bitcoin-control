import { NextRequest } from "next/server";
import { spawn } from "child_process";
import { getRepoPath, pktLine } from "@/lib/git";

export const dynamic = "force-dynamic";

function runGit(
  command: string,
  args: string[],
  stdin?: Buffer
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    const chunks: Buffer[] = [];

    proc.stdout.on("data", (data: Buffer) => chunks.push(data));
    proc.stderr.on("data", () => {});

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
      } else {
        resolve(Buffer.concat(chunks));
      }
    });

    if (stdin && stdin.length > 0) {
      proc.stdin.write(stdin);
    }
    proc.stdin.end();
  });
}

async function handleInfoRefs(
  repoPath: string,
  service: string
): Promise<Response> {
  const body = await runGit(service, [
    "--stateless-rpc",
    "--advertise-refs",
    repoPath,
  ]);

  const header = pktLine(`# service=${service}\n`);
  const fullBody = Buffer.concat([Buffer.from(header + "0000"), body]);

  return new Response(new Uint8Array(fullBody), {
    headers: {
      "Content-Type": `application/x-${service}-advertisement`,
      "Cache-Control": "no-cache",
    },
  });
}

async function handleServiceRpc(
  repoPath: string,
  service: string,
  request: NextRequest
): Promise<Response> {
  const reqBody = Buffer.from(await request.arrayBuffer());
  const body = await runGit(
    service,
    ["--stateless-rpc", repoPath],
    reqBody
  );

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": `application/x-${service}-result`,
      "Cache-Control": "no-cache",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (segments.length < 2) {
    return new Response("Not found", { status: 404 });
  }

  const repoName = segments[0];
  const restPath = segments.slice(1).join("/");
  const repoPath = getRepoPath(repoName);

  if (!repoPath) {
    return new Response("Repository not found", { status: 404 });
  }

  if (restPath === "info/refs") {
    const service = request.nextUrl.searchParams.get("service");
    if (
      !service ||
      !["git-upload-pack", "git-receive-pack"].includes(service)
    ) {
      return new Response("Invalid service", { status: 400 });
    }
    return handleInfoRefs(repoPath, service);
  }

  return new Response("Not found", { status: 404 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (segments.length < 2) {
    return new Response("Not found", { status: 404 });
  }

  const repoName = segments[0];
  const restPath = segments.slice(1).join("/");
  const repoPath = getRepoPath(repoName);

  if (!repoPath) {
    return new Response("Repository not found", { status: 404 });
  }

  if (
    restPath === "git-upload-pack" ||
    restPath === "git-receive-pack"
  ) {
    return handleServiceRpc(repoPath, restPath, request);
  }

  return new Response("Not found", { status: 404 });
}
