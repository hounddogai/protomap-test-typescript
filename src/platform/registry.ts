import { Client, status } from "@grpc/grpc-js";
import { RpcError } from "./errors.js";

/** Generated clients are created once per process and shared by the domain adapters. */
export class ClientRegistry {
  private readonly clients = new Map<string, Client>();
  put(name: string, client: Client): void {
    if (this.clients.has(name)) throw new RpcError(status.ALREADY_EXISTS, `Client ${name} already registered`);
    this.clients.set(name, client);
  }
  get<T extends Client>(name: string): T {
    const client = this.clients.get(name);
    if (!client) throw new RpcError(status.FAILED_PRECONDITION, `Client ${name} is not registered`);
    // Wiring owns this association; callers still have the concrete generated method signatures.
    return client as T;
  }
  close(): void { for (const client of this.clients.values()) client.close(); }
}
