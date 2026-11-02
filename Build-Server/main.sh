#!/bin/bash

export GIT_REPOSITORY_URL="$GIT_REPOSITORY_URL"

git clone "$GIT_REPOSITORY_URL" /home/shantanu/Project_Deplo/output

exec node script.js