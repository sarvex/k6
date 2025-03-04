import http from "k6/http";
import { browser } from "k6/browser";
import { sleep } from "k6";

export const options = {
    scenarios: {
        ui: {
            executor: "shared-iterations",
            options: {
                browser: {
                    type: "chromium",
                },
            },
        },
    },
};

export default async function () {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

    // We need to copy these over to the global context otherwise they
    // are not accessible from the newly created AsyncFunction below.
    global.http = http
    global.browser = browser
    global.sleep = sleep

    while (true) {
        try {
            var input = read_stdin("> ");

            // Special syntax: '%set foo = 123' actually evaluates
            // 'global.foo = 123', which sets the value in globals.
            // The value can then be referenced by just using 'foo',
            // as if we had run 'var foo = 123'.
            if (input.startsWith("%set ")) {
                input = "global." + input.substring(4).trim();
            }

            var fn = undefined;
            try {
                // Input was an expression
                fn = AsyncFunction("return " + input)
            } catch (error) {
                // Input was a statement
                fn = AsyncFunction(input)
            }

            var result = await fn();

            // Easily access the last expression result with '_'.
            global._ = result;

            if (result !== undefined && result !== null) {
                console.log(result.toString());
            }
        } catch (error) {
            console.error(error.toString());
            input = input.trim();
            if (input.startsWith("let") || input.startsWith("const") || input.startsWith("var")) {
                console.info("Hint: In order to set a variable globally, use `%foo = 123`.");
            }
        }
    }
}
