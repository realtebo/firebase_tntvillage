pipeline {
  agent any
  stages {
    stage('prova stage') {
      steps {
        dir(path: './functioms') {
          sh 'node run lint'
        }

      }
    }
  }
}