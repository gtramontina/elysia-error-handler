# Elysia Error Handler

Elysia plugin to define HTTP error handlers in a more declarative way.

## Installation

```sh
bun add --exact @gtramontina.com/elysia-error-handler
```

## Usage

```typescript
import { errorHandler } from "@gtramontina.com/elysia-error-handler";
import { Elysia } from "elysia";

class CustomForbiddenError extends Error { status = 403 }

new Elysia()
	.use(
		errorHandler({
			400: () => new Response("too bad!", { status: 400 }), // return Response
			403: () => 403,                                       // return number
			404: () => "uh-oh! not found!",                       // return string
			500: ({ error }) => `error: ${error.message}`,        // access to context
		}),
	)
	.get("/400", () => { throw new ParseError(); })
	.get("/403", () => { throw new CustomForbiddenError(); })
	.get("/404", () => { throw new NotFoundError(); })
	.get("/500", () => { throw new Error("boom!"); })
	.listen(3000);
```

You can also import…

```typescript
import { ErrorStatus } from "@gtramontina.com/elysia-error-handler";
```

…for more descriptive error status names, such as `ErrorStatus.BadRequest`, `ErrorStatus.TooManyRequests`, and so on.
