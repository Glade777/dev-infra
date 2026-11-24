pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-cred',
                    url: 'https://github.com/Glade777/dev-infra'
            }
        }

        stage('Deploy & Restart') {
            steps {
                script {
                    env.APP_VERSION = "v${BUILD_NUMBER}"

                    withCredentials([file(credentialsId: 'prod-env-file', variable: 'ENV_FILE_PATH')]) {
                        sh """
                            APP_VERSION=${env.APP_VERSION} docker compose --env-file "\$ENV_FILE_PATH" -f docker-compose.yml up -d --build --remove-orphans
                        """
                    }
                }
            }
        }
    }

}

