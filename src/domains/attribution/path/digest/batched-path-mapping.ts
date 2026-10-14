import * as text from "../../../../kit/text.js";

/** Where a batched path mapping is in its life cycle. */
export type BatchedPathMappingStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** The record of a batched path mapping and its current status. */
export class BatchedPathMapping {
  code: string;
  label: string;
  windowDays: number;
  visible: boolean;
  title: string;
  contactEmail: string;
  ownerId: string;
  status: BatchedPathMappingStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    visible: boolean,
    title: string,
    contactEmail: string,
    ownerId: string,
    status: BatchedPathMappingStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.visible = visible;
    this.title = title;
    this.contactEmail = contactEmail;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: BatchedPathMappingStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        switch (next) {
          case "draining":
          case "stopped":
            return true;
        }
        return false;
      case "ready":
        return next === "draining";
      case "draining":
        return next === "stopped";
    }
    return false;
  }

  moveTo(next: BatchedPathMappingStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`batched path mapping ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  measuredValue(): number {
    return this.windowDays;
  }

  copy(): BatchedPathMapping {
    return new BatchedPathMapping(
      this.code,
      this.label,
      this.windowDays,
      this.visible,
      this.title,
      this.contactEmail,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a batched path mapping in status idle. */
export function newBatchedPathMapping(code: string, label: string): BatchedPathMapping {
  return new BatchedPathMapping(code, label, 0, false, "", "", "", "idle");
}
