pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        IMAGE_NAME = 'jenkins-cicd-demo'
        DEPLOY_CONTAINER = 'jenkins-cicd-demo-deployed'
        DEPLOY_PORT = '3001'
    }

    stages {
        stage('SCM Checkout') {
            steps {
                echo 'Checking out source code from GitHub'
                checkout scm
                sh 'git rev-parse --short HEAD'
            }
        }

        stage('Parallel Module Validation') {
            parallel {
                stage('Validate User Module') {
                    steps {
                        sh '''
                            docker run --rm \
                              -v "$WORKSPACE:/app" \
                              -w /app \
                              node:20-alpine \
                              node -e "require('./modules/user')"
                        '''
                    }
                }

                stage('Validate Order Module') {
                    steps {
                        sh '''
                            docker run --rm \
                              -v "$WORKSPACE:/app" \
                              -w /app \
                              node:20-alpine \
                              node -e "require('./modules/order')"
                        '''
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .'
            }
        }

        stage('Unit Tests') {
            steps {
                sh '''
                    docker run --rm \
                      -v "$WORKSPACE:/app" \
                      -w /app \
                      node:20-alpine \
                      sh -c 'node --test tests/*.test.js'
                '''
            }
        }

        stage('Integration Test') {
            steps {
                sh '''
                    set -eu

                    TEST_CONTAINER="${IMAGE_NAME}-integration-${BUILD_NUMBER}"
                    cleanup() {
                        docker rm -f "$TEST_CONTAINER" >/dev/null 2>&1 || true
                    }
                    trap cleanup EXIT

                    docker run -d \
                      --name "$TEST_CONTAINER" \
                      -p 127.0.0.1:3002:3000 \
                      "${IMAGE_NAME}:${BUILD_NUMBER}"

                    for attempt in $(seq 1 20); do
                        if curl --fail --silent \
                          http://127.0.0.1:3002/health; then
                            echo
                            echo "Integration test passed"
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "Integration test failed"
                    docker logs "$TEST_CONTAINER"
                    exit 1
                '''
            }
        }

        stage('Deploy Demo') {
            steps {
                sh '''
                    set -eu

                    docker rm -f "$DEPLOY_CONTAINER" >/dev/null 2>&1 || true

                    docker run -d \
                      --name "$DEPLOY_CONTAINER" \
                      --restart unless-stopped \
                      -p 127.0.0.1:${DEPLOY_PORT}:3000 \
                      "${IMAGE_NAME}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Smoke Test') {
            steps {
                sh '''
                    set -eu

                    for attempt in $(seq 1 20); do
                        if curl --fail --silent \
                          http://127.0.0.1:${DEPLOY_PORT}/health; then
                            echo
                            echo "Deployment smoke test passed"
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "Smoke test failed"
                    docker logs "$DEPLOY_CONTAINER"
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            script {
                def result = currentBuild.currentResult ?: 'UNKNOWN'

                writeFile file: 'build-report.html', text: """
                <!DOCTYPE html>
                <html>
                <head><title>Jenkins CI/CD Build Report</title></head>
                <body>
                  <h1>Jenkins CI/CD Build Report</h1>
                  <p>Build number: ${env.BUILD_NUMBER}</p>
                  <p>Result: ${result}</p>
                  <p>Job: ${env.JOB_NAME}</p>
                  <p>Build URL: <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                </body>
                </html>
                """
            }

            archiveArtifacts artifacts: 'build-report.html',
                             allowEmptyArchive: true

            echo "Pipeline finished with result: ${currentBuild.currentResult}"
        }

        success {
            echo 'All pipeline stages passed!'
        }

        failure {
            echo 'Pipeline failed. Check the stage logs and build report.'
        }
    }
}
