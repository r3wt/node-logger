import { StandardTransport, LogLevels, Logger } from "../lib/Logger";

export default class ConsoleTransport implements StandardTransport {

  private delayed: boolean;

  constructor(options?:{ nextTick?: boolean }) {
    this.delayed = options?.nextTick ?? false;
  }

  public write(message:string, level:LogLevels, logger: Logger ) {
    const stream = logger.isError(level) ? 'stderr' : 'stdout';
    if (this.delayed) {
      process.nextTick(() => process[stream].write(message));
    } else {
      process[stream].write(message);
    }
  }

}