import { describe, it, expect, vi, beforeEach } from "vitest"
import { TaskScheduler } from "../TaskScheduler.js"
import { Task } from "../Task.js"
import { RooCodeEventName } from "@roo-code/types"

// 模拟Task类
const mockTask = (taskId: string) => ({
	taskId,
	_taskMode: "code",
	metadata: { title: `Test Task ${taskId}` },
	emit: vi.fn(),
	on: vi.fn(),
	off: vi.fn(),
	abortTask: vi.fn().mockResolvedValue(undefined),
})

describe("TaskScheduler", () => {
	let scheduler: TaskScheduler

	beforeEach(() => {
		scheduler = new TaskScheduler(2) // 最大2个并发任务
		vi.clearAllMocks()
	})

	describe("构造函数", () => {
		it("应该使用默认最大并发数", () => {
			const defaultScheduler = new TaskScheduler()
			expect(defaultScheduler.getStats().maxConcurrentTasks).toBe(3)
		})

		it("应该使用指定的最大并发数", () => {
			const customScheduler = new TaskScheduler(5)
			expect(customScheduler.getStats().maxConcurrentTasks).toBe(5)
		})

		it("应该拒绝无效的最大并发数", () => {
			expect(() => new TaskScheduler(0)).toThrow()
			expect(() => new TaskScheduler(-1)).toThrow()
		})
	})

	describe("scheduleTask", () => {
		it("应该立即启动任务当未达到最大并发数时", async () => {
			const task = mockTask("task-1") as any

			await scheduler.scheduleTask(task)

			const stats = scheduler.getStats()
			expect(stats.activeTasks).toBe(1)
			expect(stats.queuedTasks).toBe(0)
		})

		it("应该将任务加入队列当达到最大并发数时", async () => {
			// 先启动2个任务（达到最大并发数）
			const task1 = mockTask("task-1") as any
			const task2 = mockTask("task-2") as any
			const task3 = mockTask("task-3") as any

			await scheduler.scheduleTask(task1)
			await scheduler.scheduleTask(task2)
			await scheduler.scheduleTask(task3)

			const stats = scheduler.getStats()
			expect(stats.activeTasks).toBe(2)
			expect(stats.queuedTasks).toBe(1)
		})

		it("应该拒绝重复的任务ID", async () => {
			const task = mockTask("task-1") as any

			await scheduler.scheduleTask(task)

			// 尝试再次调度相同ID的任务
			const task2 = mockTask("task-1") as any
			await expect(scheduler.scheduleTask(task2)).rejects.toThrow()
		})
	})

	describe("getActiveTasks", () => {
		it("应该返回活跃任务列表", async () => {
			const task1 = mockTask("task-1") as any
			const task2 = mockTask("task-2") as any

			await scheduler.scheduleTask(task1)
			await scheduler.scheduleTask(task2)

			const activeTasks = scheduler.getActiveTasks()
			expect(activeTasks).toHaveLength(2)
			expect(activeTasks[0].taskId).toBe("task-1")
			expect(activeTasks[1].taskId).toBe("task-2")
		})
	})

	describe("getQueuedTasks", () => {
		it("应该返回等待队列", async () => {
			// 设置最大并发数为1
			const singleScheduler = new TaskScheduler(1)

			const task1 = mockTask("task-1") as any
			const task2 = mockTask("task-2") as any

			await singleScheduler.scheduleTask(task1)
			await singleScheduler.scheduleTask(task2)

			const queuedTasks = singleScheduler.getQueuedTasks()
			expect(queuedTasks).toHaveLength(1)
			expect(queuedTasks[0].taskId).toBe("task-2")
		})
	})

	describe("getTaskStatus", () => {
		it("应该返回任务状态", async () => {
			const singleScheduler = new TaskScheduler(1)

			const task1 = mockTask("task-1") as any
			const task2 = mockTask("task-2") as any

			await singleScheduler.scheduleTask(task1)
			await singleScheduler.scheduleTask(task2)

			expect(singleScheduler.getTaskStatus("task-1")).toBe("active")
			expect(singleScheduler.getTaskStatus("task-2")).toBe("queued")
			expect(singleScheduler.getTaskStatus("task-3")).toBe("not-found")
		})
	})

	describe("cancelTask", () => {
		it("应该取消活跃任务", async () => {
			const task = mockTask("task-1") as any

			await scheduler.scheduleTask(task)
			expect(scheduler.getStats().activeTasks).toBe(1)

			const result = await scheduler.cancelTask("task-1")
			expect(result).toBe(true)
			expect(task.abortTask).toHaveBeenCalledWith(true)
		})

		it("应该从队列中移除任务", async () => {
			const singleScheduler = new TaskScheduler(1)

			const task1 = mockTask("task-1") as any
			const task2 = mockTask("task-2") as any

			await singleScheduler.scheduleTask(task1)
			await singleScheduler.scheduleTask(task2)

			expect(singleScheduler.getStats().queuedTasks).toBe(1)

			const result = await singleScheduler.cancelTask("task-2")
			expect(result).toBe(true)
			expect(singleScheduler.getStats().queuedTasks).toBe(0)
		})

		it("应该返回false当任务不存在时", async () => {
			const result = await scheduler.cancelTask("non-existent")
			expect(result).toBe(false)
		})
	})

	describe("setMaxConcurrentTasks", () => {
		it("应该更新最大并发数", () => {
			scheduler.setMaxConcurrentTasks(5)
			expect(scheduler.getStats().maxConcurrentTasks).toBe(5)
		})

		it("应该拒绝无效的最大并发数", () => {
			expect(() => scheduler.setMaxConcurrentTasks(0)).toThrow()
			expect(() => scheduler.setMaxConcurrentTasks(-1)).toThrow()
		})

		it("应该处理队列当增加并发数时", async () => {
			const singleScheduler = new TaskScheduler(1)

			const task1 = mockTask("task-1") as any
			const task2 = mockTask("task-2") as any
			const task3 = mockTask("task-3") as any

			await singleScheduler.scheduleTask(task1)
			await singleScheduler.scheduleTask(task2)
			await singleScheduler.scheduleTask(task3)

			expect(singleScheduler.getStats().activeTasks).toBe(1)
			expect(singleScheduler.getStats().queuedTasks).toBe(2)

			// 增加并发数到3
			singleScheduler.setMaxConcurrentTasks(3)

			// 应该自动处理队列中的任务
			expect(singleScheduler.getStats().activeTasks).toBe(3)
			expect(singleScheduler.getStats().queuedTasks).toBe(0)
		})
	})

	describe("资源锁管理", () => {
		it("应该获取和释放资源锁", () => {
			expect(scheduler.acquireResourceLock("file.txt", "task-1")).toBe(true)
			expect(scheduler.acquireResourceLock("file.txt", "task-2")).toBe(false) // 已被task-1锁定

			scheduler.releaseResourceLock("file.txt", "task-1")
			expect(scheduler.acquireResourceLock("file.txt", "task-2")).toBe(true) // 现在可以获取
		})

		it("应该释放任务持有的所有资源锁", async () => {
			const task = mockTask("task-1") as any

			await scheduler.scheduleTask(task)

			// 获取多个资源锁
			scheduler.acquireResourceLock("file1.txt", "task-1")
			scheduler.acquireResourceLock("file2.txt", "task-1")
			scheduler.acquireResourceLock("file3.txt", "task-1")

			// 取消任务应该释放所有锁
			await scheduler.cancelTask("task-1")

			// 现在其他任务应该可以获取这些资源
			expect(scheduler.acquireResourceLock("file1.txt", "task-2")).toBe(true)
			expect(scheduler.acquireResourceLock("file2.txt", "task-2")).toBe(true)
			expect(scheduler.acquireResourceLock("file3.txt", "task-2")).toBe(true)
		})
	})

	describe("任务完成处理", () => {
		it("应该在任务完成后处理队列", async () => {
			const singleScheduler = new TaskScheduler(1)

			const task1 = mockTask("task-1") as any
			const task2 = mockTask("task-2") as any

			await singleScheduler.scheduleTask(task1)
			await singleScheduler.scheduleTask(task2)

			expect(singleScheduler.getStats().activeTasks).toBe(1)
			expect(singleScheduler.getStats().queuedTasks).toBe(1)

			// 模拟任务完成
			await singleScheduler.cancelTask("task-1")

			// 应该自动处理队列中的任务
			expect(singleScheduler.getStats().activeTasks).toBe(1)
			expect(singleScheduler.getStats().queuedTasks).toBe(0)
		})
	})
})
