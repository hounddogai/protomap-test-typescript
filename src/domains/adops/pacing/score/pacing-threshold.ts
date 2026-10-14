import * as text from "../../../../kit/text.js";

/** Where a pacing threshold is in its life cycle. */
export type PacingThresholdStatus = "created" | "validated" | "published" | "retired";

/** The record of a pacing threshold and its current status. */
export class PacingThreshold {
  code: string;
  name: string;
  updatedAt: number;
  title: string;
  capacity: number;
  phone: string;
  tags: string[];
  limit: number;
  visible: boolean;
  createdAt: number;
  status: PacingThresholdStatus;

  constructor(
    code: string,
    name: string,
    updatedAt: number,
    title: string,
    capacity: number,
    phone: string,
    tags: string[],
    limit: number,
    visible: boolean,
    createdAt: number,
    status: PacingThresholdStatus,
  ) {
    this.code = code;
    this.name = name;
    this.updatedAt = updatedAt;
    this.title = title;
    this.capacity = capacity;
    this.phone = phone;
    this.tags = tags;
    this.limit = limit;
    this.visible = visible;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingThresholdStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PacingThresholdStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing threshold ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  adjustedExposure(): number {
    return Math.round((this.limit - this.capacity) * 100) / 100;
  }

  copy(): PacingThreshold {
    return new PacingThreshold(
      this.code,
      this.name,
      this.updatedAt,
      this.title,
      this.capacity,
      this.phone,
      this.tags,
      this.limit,
      this.visible,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a pacing threshold in status created. */
export function newPacingThreshold(code: string, name: string): PacingThreshold {
  return new PacingThreshold(code, name, 0, "", 0, "", [], 0, false, 0, "created");
}
