FROM rabbitmq:3.11.6-management-alpine

RUN apk --no-cache add curl

RUN curl -L https://github.com/noxdafox/rabbitmq-message-deduplication/releases/download/0.6.0/elixir-1.13.4.ez > /opt/rabbitmq/plugins/elixir-1.13.4.ez

RUN curl -L https://github.com/noxdafox/rabbitmq-message-deduplication/releases/download/0.6.0/rabbitmq_message_deduplication-0.6.0.ez > /opt/rabbitmq/plugins/rabbitmq_message_deduplication-0.6.0.ez

RUN rabbitmq-plugins enable rabbitmq_message_deduplication
