package com.eventcontrol.refereeapp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * 示例单元测试
 */
class ExampleUnitTest {

    @Test
    fun addition_isCorrect() {
        assertEquals(4, 2 + 2)
    }

    @Test
    fun string_operations() {
        val str = "Hello Referee App"
        assertEquals(16, str.length)
        assertTrue(str.contains("Referee"))
    }
}
