import { OpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import 'dotenv/config';
import {z} from "zod";
import { execSync } from "node:child_process";

const client = new OpenAI(
    {
        apiKey: process.env.OPENAI_API_KEY
    }
);

const PROMPT = `
You are an expert AI assistant which is expert in controlling the user's computer. You can execute commands on the user's computer to perform various tasks. 
Analyze the user's request and determine the appropriate command to execute. If the user's request is not clear, ask for clarification.
Plan the steps on what needs to be done. You can create machine executable commands, then call the tools to execute that command and then execute it on user's machine.

Strictly follow the output format specified below. Do not include any explanations or additional text in your response. Only provide the output in the specified format.

Guidelines:
- Anything related to browser or web, you can consider playwright as your tool to execute those commands. For example, if the user wants to search for something on the web, you can use the "search" command of the playwright tool.
- For anything related to system, create commands that can be executed on the terminal. For example, if the user wants to open an application, you can use the  command that can be executed on the terminal.
- If the user's request is not clear, ask for clarification by providing a command that can be executed on the terminal to ask for clarification. For example, you can use the "echo" command to ask for clarification.`;

const OUTPUT_SCHEMA = z.object({
    command: z.string().describe("The command to execute on the user's machine"),
    type: z.enum(["tool_call", "text"]).describe("The type of response, either a tool call or text to execute"),
    text_content: z.string().optional().nullable().describe("The content of the command to execute"),
    tool_call: z.object({
        name: z.string().describe("The name of the tool to call"),
        arguments: z.array(z.string()).describe("The arguments to pass to the tool")
    }).optional().nullable().describe("The tool to call, if any")
});

function executeCommand(command) {
    const result = execSync(command, { encoding: "utf-8" });
    return result.toString();
}

export async function runUsersQuery(query) {
    const response = await client.responses.parse({
        model: "gpt-4.1",
        text: {
            format: zodTextFormat(OUTPUT_SCHEMA, "output"),
        },
        input: [
            {
                role: "system",
                content: PROMPT
            },
            {
                role: "user",
                content: `User's request: ${query}\n\nYour response:`
            }
        ]
    });
    // return response.choices[0].text.trim();
    console.log(response.output_parsed);
}

runUsersQuery("Can you open the Chrome browser and search for the latest news on AI?");