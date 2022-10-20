import { PubSub, SubscriptionMetadata } from '@google-cloud/pubsub';

const ACK_DEADLINE = 60;

const NEWLINE_SEPARATOR = '\n';
const TOPIC_SEPARATOR = ';';
const SUBSCRIPTION_SEPARATOR = '|';

async function createSubscription(
	pubSubClient: PubSub,
	topicName: string,
	pushEndpoint: string,
) {
	const options: SubscriptionMetadata = {
		pushConfig: pushEndpoint ? {
			pushEndpoint,
		} : undefined,
		name: topicName,
		topic: topicName,
		ackDeadlineSeconds: ACK_DEADLINE,
		expirationPolicy: {
			ttl: null,
		},
		retryPolicy: {
			minimumBackoff: {
				seconds: 5,
			},
			maximumBackoff: {
				seconds: 30,
			},
		},
	};

	await pubSubClient
		.topic(topicName)
		.createSubscription(
			topicName,
			options,
		);
	// eslint-disable-next-line no-console
	console.log(`Subscription ${topicName} created.`, pushEndpoint);
}

async function createTopic(pubSubClient: PubSub, topicName: string, pushEndpoint: string) {
	// Creates a new topic
	await pubSubClient.createTopic(topicName);
	// eslint-disable-next-line no-console
	console.log(`Topic ${topicName} created.`);
	await createSubscription(pubSubClient, topicName, pushEndpoint);
}

const migrate = async () => {
	if (!process.env.PUBSUB_PROJECT1) {
		throw new Error('process.env.PUBSUB_PROJECT1 variable not defined');
	}

	const [
		projectId,
		...subscriptions
	] = process.env.PUBSUB_PROJECT1.split(NEWLINE_SEPARATOR);
	const pubSubClient = new PubSub({
		// apiEndpoint: 'localhost:8681',
		projectId,
	});

	const subscriptionsToCreate = subscriptions.filter(Boolean).map((sub) => {
		const [
			topic,
			subscriptionString,
		] = sub.split(TOPIC_SEPARATOR);
		const [
			subscription,
			pushUrl,
		] = subscriptionString.split(SUBSCRIPTION_SEPARATOR);
		return {
			topic,
			subscription,
			pushUrl,
		};
	});

	// eslint-disable-next-line no-console
	console.log({ projectId });
	// eslint-disable-next-line no-console
	console.log({ subscriptionsToCreate });
	
	await Promise.all(subscriptionsToCreate.map(topic => createTopic(pubSubClient, topic.topic, topic.pushUrl)));
	console.log('Finished setting everything up');
};

migrate()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
