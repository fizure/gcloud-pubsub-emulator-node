import { PubSub } from '@google-cloud/pubsub';
const ACK_DEADLINE = 60;
const NEWLINE_SEPARATOR = '\n';
const TOPIC_SEPARATOR = ';';
async function createSubscription(pubSubClient, topicName, pushEndpoint) {
    const options = {
        pushConfig: {
            pushEndpoint,
        },
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
        .createSubscription(topicName, options);
    // eslint-disable-next-line no-console
    console.log(`Subscription ${topicName} created.`, pushEndpoint);
}
async function createTopic(pubSubClient, topicName, pushEndpoint) {
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
    const [projectId, ...subscriptions] = process.env.PUBSUB_PROJECT1.split(NEWLINE_SEPARATOR);
    const pubSubClient = new PubSub({
        // apiEndpoint: 'localhost:8681',
        projectId,
    });
    const subscriptionsToCreate = subscriptions.map((sub) => {
        const [topic, subscription, pushUrl,] = sub.split(TOPIC_SEPARATOR);
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
};
await migrate();
