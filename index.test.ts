import { describe, expect, it } from "bun:test";
import {
	Elysia,
	InvalidCookieSignature,
	NotFoundError,
	ParseError,
} from "elysia";
import { ErrorStatus, errorHandler } from ".";

describe("elysia-error-handler", () => {
	it("falls through when there are no errors", async () => {
		const response = await new Elysia()
			.use(errorHandler())
			.get("/", () => "all good!")
			.handle(new Request("http://localhost/"));

		expect(response.status).toBe(200);
		expect(response.text()).resolves.toEqual("all good!");
	});

	describe("default error handlers", () => {
		for (const { name, error, expectedStatus, expectedMessage } of [
			{
				name: "NotFoundError",
				error: new NotFoundError("boom!"),
				expectedStatus: 404,
				expectedMessage: "boom!",
			},
			{
				name: "ParseError",
				error: new ParseError("boom!"),
				expectedStatus: 400,
				expectedMessage: "boom!",
			},
			{
				name: "InvalidCookieSignature",
				error: new InvalidCookieSignature("boom!"),
				expectedStatus: 400,
				expectedMessage: `"boom!" has invalid cookie signature`,
			},
			{
				name: "Error",
				error: new Error("boom!"),
				expectedStatus: 500,
				expectedMessage: "boom!",
			},
		]) {
			it(`${expectedStatus} - ${name}`, async () => {
				const response = await new Elysia()
					.use(errorHandler())
					.get("/", () => {
						throw error;
					})
					.handle(new Request("http://localhost/"));

				expect(response.status).toBe(expectedStatus);
				expect(response.json()).resolves.toEqual({
					name: "Error",
					message: expectedMessage,
				});
			});
		}
	});

	describe("overriding default error handlers", () => {
		for (const { name, error, handlers, expectedStatus, expectedMessage } of [
			{
				name: "NotFoundError",
				error: new NotFoundError("boom!"),
				handlers: {
					[ErrorStatus.NotFound]: () =>
						new Response("custom not found!", { status: 404 }),
				},
				expectedStatus: 404,
				expectedMessage: "custom not found!",
			},
			{
				name: "ParseError",
				error: new ParseError("boom!"),
				handlers: {
					[ErrorStatus.BadRequest]: () =>
						new Response("custom bad request!", { status: 400 }),
				},
				expectedStatus: 400,
				expectedMessage: "custom bad request!",
			},
			{
				name: "InvalidCookieSignature",
				error: new InvalidCookieSignature("boom!"),
				handlers: {
					[ErrorStatus.BadRequest]: () =>
						new Response("custom bad request!", { status: 400 }),
				},
				expectedStatus: 400,
				expectedMessage: "custom bad request!",
			},
			{
				name: "Error",
				error: new Error("boom!"),
				handlers: {
					[ErrorStatus.InternalServerError]: () =>
						new Response("custom internal server error!", { status: 500 }),
				},
				expectedStatus: 500,
				expectedMessage: "custom internal server error!",
			},
		]) {
			it(`${expectedStatus} - ${name}`, async () => {
				const response = await new Elysia()
					.use(errorHandler(handlers))
					.get("/", () => {
						throw error;
					})
					.handle(new Request("http://localhost/"));

				expect(response.status).toBe(expectedStatus);
				expect(response.text()).resolves.toEqual(expectedMessage);
			});
		}
	});

	describe("throwing custom errors with `status`", () => {
		it("executes the custom error handler", async () => {
			const response = await new Elysia()
				.use(
					errorHandler({
						[ErrorStatus.Forbidden]: () =>
							new Response("custom forbidden!", { status: 403 }),
					}),
				)
				.get("/", () => {
					throw new CustomForbiddenError();
				})
				.handle(new Request("http://localhost/"));

			expect(response.status).toBe(403);
			expect(response.text()).resolves.toEqual("custom forbidden!");
		});
	});

	it("handles different errors and responses", async () => {
		const app = new Elysia()
			.use(
				errorHandler({
					400: () => new Response("too bad!", { status: 400 }),
					403: () => 403,
					404: () => "uh-oh! not found!",
					500: ({ error }) => `error: ${error.message}`,
				}),
			)
			.get("/400", () => {
				throw new ParseError();
			})
			.get("/403", () => {
				throw new CustomForbiddenError();
			})
			.get("/404", () => {
				throw new NotFoundError();
			})
			.get("/500", () => {
				throw new Error("boom!");
			});

		const badRequestResponse = await app.handle(
			new Request("http://localhost/400"),
		);
		expect(badRequestResponse.status).toBe(400);
		expect(badRequestResponse.text()).resolves.toEqual("too bad!");

		const forbiddenResponse = await app.handle(
			new Request("http://localhost/403"),
		);
		expect(forbiddenResponse.status).toBe(403);
		expect(forbiddenResponse.text()).resolves.toEqual("403");

		const notFoundResponse = await app.handle(
			new Request("http://localhost/404"),
		);
		expect(notFoundResponse.status).toBe(404);
		expect(notFoundResponse.text()).resolves.toEqual("uh-oh! not found!");

		const internalServerErrorResponse = await app.handle(
			new Request("http://localhost/500"),
		);
		expect(internalServerErrorResponse.status).toBe(500);
		expect(internalServerErrorResponse.text()).resolves.toEqual("error: boom!");
	});
});

// ---

class CustomForbiddenError extends Error {
	status = 403;
}
