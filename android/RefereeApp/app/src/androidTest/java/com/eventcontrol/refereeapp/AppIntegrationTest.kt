package com.eventcontrol.refereeapp

import androidx.test.ext.junit.rules.activityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import com.eventcontrol.refereeapp.data.local.DataStoreManager
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.test.runTest
import org.junit.Rule
import org.junit.Test

/**
 * Android 集成测试：测试应用组件和本地存储
 */
class AppIntegrationTest {

    @get:Rule
    val activityRule = activityScenarioRule<MainActivity>()

    @Test
    fun useAppContext() {
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        assertThat(appContext.packageName).isEqualTo("com.eventcontrol.refereeapp")
    }

    @Test
    fun activityStarts() {
        // 验证 MainActivity 可以正常启动
        activityRule.scenario.onActivity { activity ->
            assertThat(activity).isNotNull()
        }
    }
}

/**
 * 数据存储集成测试
 */
class DataStoreIntegrationTest {

    @Test
    fun dataStoreSaveAndRetrieve() = runTest {
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        val dataStoreManager = DataStoreManager(appContext)

        // 测试保存服务器地址
        dataStoreManager.saveServerAddress("http://localhost:3001")

        // 验证保存成功
        val savedAddress = dataStoreManager.getServerAddress()
        assertThat(savedAddress).isEqualTo("http://localhost:3001")
    }

    @Test
    fun dataStoreSaveMatchId() = runTest {
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        val dataStoreManager = DataStoreManager(appContext)

        // 保存比赛ID
        dataStoreManager.saveCurrentMatchId("match-test-123")

        // 验证
        val savedMatchId = dataStoreManager.getCurrentMatchId()
        assertThat(savedMatchId).isEqualTo("match-test-123")
    }

    @Test
    fun dataStoreClearData() = runTest {
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        val dataStoreManager = DataStoreManager(appContext)

        // 保存数据
        dataStoreManager.saveServerAddress("http://localhost:3001")
        dataStoreManager.saveCurrentMatchId("match-1")

        // 清除所有数据
        dataStoreManager.clearAll()

        // 验证
        assertThat(dataStoreManager.getServerAddress().isEmpty()).isTrue()
        assertThat(dataStoreManager.getCurrentMatchId().isEmpty()).isTrue()
    }
}
