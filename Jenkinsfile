pipeline {
  agent any
  stages {
    stage('prova stage') {
      steps {
        dir(path: './functions')
        sh 'node run lint'
        sh 'node run build'
      }
    }
  }
}