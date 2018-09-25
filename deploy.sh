#!/bin/bash

while getopts d: option
do
case "${option}"
in
d) DOCKER_REPO_NAME=${OPTARG};;
esac
done

echo "DOCKER_REPO_NAME:" $DOCKER_REPO_NAME

docker build -t $DOCKER_REPO_NAME .
DOCKER_BUILD_ID=$(docker images $DOCKER_REPO_NAME -q)
DOCKER_REGISTRY=antonio94js

echo "DEPLOYMENT STEP: The docker build ID generated is --> $DOCKER_BUILD_ID"

echo "DEPLOYMENT STEP: Tagging $DOCKER_REPO_NAME:latest --> antonio94js/$DOCKER_REPO_NAME:$DOCKER_BUILD_ID"
docker tag $DOCKER_REPO_NAME:latest $DOCKER_REGISTRY/$DOCKER_REPO_NAME:$DOCKER_BUILD_ID

echo "DEPLOYMENT STEP: Pushing the new Image $DOCKER_REGISTRY/$DOCKER_REPO_NAME:$DOCKER_BUILD_ID into the container register "
docker push $DOCKER_REGISTRY/$DOCKER_REPO_NAME:$DOCKER_BUILD_ID

echo "DEPLOYMENT STEP: Fetching and generating the New Task Definition, using the repository name: $DOCKER_REPO_NAME"

CONTAINER_DEFINITIONS=$(jq --arg v "$DOCKER_REPO_NAME" --arg d "${DOCKER_REGISTRY}/${DOCKER_REPO_NAME}:${DOCKER_BUILD_ID}" '.taskDefinition.containerDefinitions[].image |= if contains($v) then $d else . end | .taskDefinition.containerDefinitions' <<< "$(aws ecs describe-task-definition --task-definition application-bunkey-dev-backend)")

TASK_VERSION=$(aws ecs register-task-definition --family application-bunkey-dev-backend --container-definitions "$CONTAINER_DEFINITIONS" | jq --raw-output '.taskDefinition.revision')
echo "DEPLOYMENT STEP: Registered ECS Task Definition --> " $TASK_VERSION

CLUSTER_NAME="bunkey-dev-backend"
SERVICE_NAME="service-bunkey-dev-backend"
TASK_DEFINITION="application-bunkey-dev-backend:$TASK_VERSION"

if [ -n "$TASK_VERSION" ]; then
    echo "Update ECS Cluster: " $CLUSTER_NAME
    echo "Service: " $SERVICE_NAME
    echo "Task Definition: " $TASK_DEFINITION

    DEPLOYED_SERVICE=$(aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASK_DEFINITION | jq --raw-output '.service.serviceName')
    echo "Deployment of $DEPLOYED_SERVICE complete"

else
    echo "exit: No task definition"
    exit;
fi