import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	USER_NAME: {},
	PASSWORD: {},
	AUTH_SECRET: {},
	FACTFLEXI_API_KEY: {}
});
