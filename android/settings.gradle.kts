pluginManagement {
    repositories {
        maven { url = uri("https://mirrors.cloud.tencent.com/gradle/") }
        maven { url = uri("https://mirrors.cloud.tencent.com/repository/maven/google/") }
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "1.0.0"
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        maven { url = uri("https://mirrors.cloud.tencent.com/maven/") }
        maven { url = uri("https://mirrors.cloud.tencent.com/repository/maven/google/") }
        google()
        mavenCentral()
    }
}

rootProject.name = "EventControlSystem"
include(":app")
