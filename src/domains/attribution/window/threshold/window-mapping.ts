import * as text from "../../../../kit/text.js";

/** Where a window mapping is in its life cycle. */
export type WindowMappingStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** A window mapping. Its code is unique within a tenant. */
export class WindowMapping {
  code: string;
  name: string;
  budget: number;
  description: string;
  audienceId: string;
  startsAt: number;
  attributes: Map<string, string>;
  priority: number;
  externalRef: string;
  updatedAt: number;
  createdAt: number;
  status: WindowMappingStatus;

  constructor(
    code: string,
    name: string,
    budget: number,
    description: string,
    audienceId: string,
    startsAt: number,
    attributes: Map<string, string>,
    priority: number,
    externalRef: string,
    updatedAt: number,
    createdAt: number,
    status: WindowMappingStatus,
  ) {
    this.code = code;
    this.name = name;
    this.budget = budget;
    this.description = description;
    this.audienceId = audienceId;
    this.startsAt = startsAt;
    this.attributes = attributes;
    this.priority = priority;
    this.externalRef = externalRef;
    this.updatedAt = updatedAt;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: WindowMappingStatus): boolean {
    switch (this.status) {
      case "open":
        switch (next) {
          case "in_review":
          case "reopened":
            return true;
        }
        return false;
      case "in_review":
        switch (next) {
          case "resolved":
          case "archived":
            return true;
        }
        return false;
      case "resolved":
        switch (next) {
          case "reopened":
            return true;
        }
        return false;
      case "reopened":
        switch (next) {
          case "archived":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: WindowMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`window mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netExposure(): number {
    return Math.round((this.createdAt + this.updatedAt) * 100) / 100;
  }

  copy(): WindowMapping {
    return new WindowMapping(
      this.code,
      this.name,
      this.budget,
      this.description,
      this.audienceId,
      this.startsAt,
      this.attributes,
      this.priority,
      this.externalRef,
      this.updatedAt,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a window mapping in status open. */
export function newWindowMapping(code: string, name: string): WindowMapping {
  return new WindowMapping(code, name, 0, "", "", 0, new Map<string, string>(), 0, "", 0, 0, "open");
}
