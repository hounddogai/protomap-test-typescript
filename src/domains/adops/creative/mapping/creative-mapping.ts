/**
 * The creative mapping records of adops's creative work, and the rules, stores, and calculations around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a creative mapping is in its life cycle. */
export type CreativeMappingStatus = "requested" | "granted" | "revoked" | "expired";

/** A creative mapping as the creative team keeps it. */
export class CreativeMapping {
  code: string;
  name: string;
  sendAt: number;
  audienceId: string;
  windowDays: number;
  budget: number;
  retries: number;
  ratio: number;
  status: CreativeMappingStatus;

  constructor(
    code: string,
    name: string,
    sendAt: number,
    audienceId: string,
    windowDays: number,
    budget: number,
    retries: number,
    ratio: number,
    status: CreativeMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sendAt = sendAt;
    this.audienceId = audienceId;
    this.windowDays = windowDays;
    this.budget = budget;
    this.retries = retries;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: CreativeMappingStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: CreativeMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"creative mapping"} ${this.code}`;
  }

  netValue(): number {
    return Math.round((this.retries + this.sendAt) * 100) / 100;
  }

  copy(): CreativeMapping {
    return new CreativeMapping(
      this.code,
      this.name,
      this.sendAt,
      this.audienceId,
      this.windowDays,
      this.budget,
      this.retries,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a creative mapping in status requested. */
export function newCreativeMapping(code: string, name: string): CreativeMapping {
  return new CreativeMapping(code, name, 0, "", 0, 0, 0, 0, "requested");
}
