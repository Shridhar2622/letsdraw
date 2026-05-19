pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm install'
                }
            }
        }
        
        stage('Install Frontend Dependencies & Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Docker Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'docker build -t letsdraw-frontend .'
                }
            }
        }
        
        stage('Docker Build Backend') {
            steps {
                dir('backend') {
                    sh 'docker build -t letsdraw-backend .'
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully! All code built and Docker images created.'
        }
        failure {
            echo 'Pipeline failed. Please check the logs.'
        }
    }
}
