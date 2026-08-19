pipeline {
    agent any

    environment {
        APP_NAME = 'hostel-management'
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('Docker Clean') {
            steps {
                echo 'Cleaning existing containers...'
                sh 'docker-compose down --remove-orphans || true'
            }
        }

        stage('Docker Build') {
            steps {
                echo 'Building Docker images...'
                sh 'docker-compose build --no-cache'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Launching containerized services...'
                sh 'docker-compose up -d'
                echo 'Verifying running containers...'
                sh 'docker ps'
            }
        }
    }

    post {
        success {
            echo 'Successfully built and deployed!'
        }
        failure {
            echo 'Deployment failed. Check Jenkins build logs.'
        }
    }
}
