import * as text from "../../../../kit/text.js";

/** Where a tiered touchpoint checkpoint is in its life cycle. */
export type TieredTouchpointCheckpointStatus = "new" | "queued" | "running" | "done" | "failed";

/** A tiered touchpoint checkpoint. Its code is unique within a tenant. */
export class TieredTouchpointCheckpoint {
  code: string;
  name: string;
  audienceId: string;
  locale: string;
  version: number;
  active: boolean;
  title: string;
  phone: string;
  description: string;
  ceiling: number;
  ownerId: string;
  status: TieredTouchpointCheckpointStatus;

  constructor(
    code: string,
    name: string,
    audienceId: string,
    locale: string,
    version: number,
    active: boolean,
    title: string,
    phone: string,
    description: string,
    ceiling: number,
    ownerId: string,
    status: TieredTouchpointCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.audienceId = audienceId;
    this.locale = locale;
    this.version = version;
    this.active = active;
    this.title = title;
    this.phone = phone;
    this.description = description;
    this.ceiling = ceiling;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "failed":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredTouchpointCheckpointStatus): boolean {
    switch (this.status) {
      case "new":
        switch (next) {
          case "done":
            return true;
        }
        return false;
      case "queued":
        switch (next) {
          case "running":
            return true;
        }
        return false;
      case "running":
        return next === "failed";
      case "done":
        switch (next) {
          case "failed":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredTouchpointCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered touchpoint checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  label(): string {
    return `${"tiered touchpoint checkpoint"} ${this.code}`;
  }

  weightedExposure(): number {
    return Math.round(this.ceiling * this.version * 100) / 100;
  }

  copy(): TieredTouchpointCheckpoint {
    return new TieredTouchpointCheckpoint(
      this.code,
      this.name,
      this.audienceId,
      this.locale,
      this.version,
      this.active,
      this.title,
      this.phone,
      this.description,
      this.ceiling,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered touchpoint checkpoint in status new. */
export function newTieredTouchpointCheckpoint(code: string, name: string): TieredTouchpointCheckpoint {
  return new TieredTouchpointCheckpoint(code, name, "", "", 0, false, "", "", "", 0, "", "new");
}
