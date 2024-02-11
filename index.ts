import { type DefinitionBase, Elysia, type ErrorHandler } from "elysia";

export const ErrorStatus = {
	BadRequest: 400,
	Unauthorized: 401,
	Forbidden: 403,
	NotFound: 404,
	MethodNotAllowed: 405,
	NotAcceptable: 406,
	ProxyAuthenticationRequired: 407,
	RequestTimeout: 408,
	Conflict: 409,
	Gone: 410,
	LengthRequired: 411,
	PreconditionFailed: 412,
	PayloadTooLarge: 413,
	URITooLong: 414,
	UnsupportedMediaType: 415,
	RangeNotSatisfiable: 416,
	ExpectationFailed: 417,
	ImATeapot: 418,
	MisdirectedRequest: 421,
	UnprocessableEntity: 422,
	TooEarly: 425,
	UpgradeRequired: 426,
	PreconditionRequired: 428,
	TooManyRequests: 429,
	RequestHeaderFieldsTooLarge: 431,
	UnavailableForLegalReasons: 451,
	InternalServerError: 500,
	NotImplemented: 501,
	BadGateway: 502,
	ServiceUnavailable: 503,
	GatewayTimeout: 504,
	HTTPVersionNotSupported: 505,
	VariantAlsoNegotiates: 506,
	InsufficientStorage: 507,
	LoopDetected: 508,
	NotExtended: 510,
	NetworkAuthenticationRequired: 511,
} as const;

type ErrorStatus = (typeof ErrorStatus)[keyof typeof ErrorStatus];
type CustomHandlers = {
	[key in ErrorStatus]?: ErrorHandler<DefinitionBase["error"]>;
};

type WithStatus = { status: ErrorStatus };
const hasStatus = (error: unknown): error is WithStatus =>
	error !== undefined &&
	(error as WithStatus).status !== undefined &&
	typeof (error as WithStatus).status === "number";

export const errorHandler = (handlers: CustomHandlers = {}) => {
	return new Elysia({ name: "@gtramontina/elysia-error-handler" }).onError(
		(context) => {
			const { error } = context;

			if (hasStatus(error)) {
				const handler = handlers[error.status];
				if (handler !== undefined) {
					return handler(context);
				}
			}

			const internalServerErrorHandler =
				handlers[ErrorStatus.InternalServerError];
			if (internalServerErrorHandler !== undefined) {
				return internalServerErrorHandler(context);
			}

			return error;
		},
	);
};
