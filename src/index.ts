import yargs from "yargs";
import { infoCommand } from "./commands/info";

async function main(mainArgs: string[]) {
  await yargs.command(infoCommand).parse(mainArgs);
}

main(process.argv.slice(2)).catch((e) => console.error(e));
