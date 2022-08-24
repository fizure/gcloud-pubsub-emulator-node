
FROM google/cloud-sdk:alpine

WORKDIR /usr/app

RUN apk --update add openjdk8-jre netcat-openbsd nodejs nodejs npm && gcloud components install beta pubsub-emulator

RUN curl -s https://raw.githubusercontent.com/eficode/wait-for/master/wait-for -o /usr/bin/wait-for
RUN chmod +x /usr/bin/wait-for

COPY package.json /usr/app/package.json
RUN npm install

COPY tsconfig.json /usr/app/tsconfig.json
COPY run.sh /usr/app/run.sh
COPY index.ts /usr/app/index.ts

RUN npm run build

EXPOSE 8681

CMD /usr/app/run.sh
