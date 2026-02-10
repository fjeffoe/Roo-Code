import { Task } from "./Task.js"
import { RooCodeEventName } from "@roo-code/types"

/**
 * 任务调度器 - 管理多任务并发执行
 *
 * 负责：
 * 1. 控制并发任务数量
 * 2. 管理任务队列
 * 3. 处理任务生命周期事件
 * 4. 资源隔离和冲突避免
 */
export class TaskScheduler {
	/** 最大并发任务数 */
	private maxConcurrentTasks: number = 3

	/** 活跃任务映射表 */
	private activeTasks: Map<string, Task> = new Map()

	/** 等待队列 */
	private taskQueue: Task[] = []

	/** 任务完成回调映射 */
	private taskCompletionCallbacks: Map<string, () => void> = new Map()

	/** 资源锁管理器 */
	private resourceLocks: Map<string, string> = new Map() // resourceId -> taskId

	constructor(maxConcurrentTasks?: number) {
		if (maxConcurrentTasks !== undefined) {
			if (maxConcurrentTasks < 1) {
				throw new Error("Max concurrent tasks must be at least 1")
			}
			this.maxConcurrentTasks = maxConcurrentTasks
		}
	}

	/**
	 * 调度新任务
	 * @param task 要调度的任务
	 * @returns Promise<void> 当任务开始执行时解析
	 */
	async scheduleTask(task: Task): Promise<void> {
		const taskId = task.taskId

		// 检查是否已有相同任务ID的任务
		if (this.activeTasks.has(taskId) || this.taskQueue.some((t) => t.taskId === taskId)) {
			throw new Error(`Task with ID ${taskId} is already scheduled`)
		}

		// 如果未达到最大并发数，立即启动任务
		if (this.activeTasks.size < this.maxConcurrentTasks) {
			await this.startTask(task)
		} else {
			// 否则加入等待队列
			this.taskQueue.push(task)
			this.log(`Task ${taskId} added to queue (${this.taskQueue.length} tasks waiting)`)
		}
	}

	/**
	 * 启动任务
	 * @param task 要启动的任务
	 */
	private async startTask(task: Task): Promise<void> {
		const taskId = task.taskId

		// 添加到活跃任务
		this.activeTasks.set(taskId, task)
		this.log(`Task ${taskId} started (${this.activeTasks.size}/${this.maxConcurrentTasks} active tasks)`)

		// 监听任务完成事件
		const onCompleted = () => {
			this.onTaskCompleted(taskId)
		}

		task.on(RooCodeEventName.TaskCompleted, onCompleted)
		task.on(RooCodeEventName.TaskAborted, onCompleted)

		// 保存回调以便清理
		this.taskCompletionCallbacks.set(taskId, () => {
			task.off(RooCodeEventName.TaskCompleted, onCompleted)
			task.off(RooCodeEventName.TaskAborted, onCompleted)
		})

		// 标记任务为已调度（实际的任务启动由ClineProvider处理）
		// 这里我们只是管理调度状态，不直接启动任务循环
		this.log(`Task ${taskId} marked as active in scheduler`)
	}

	/**
	 * 任务完成回调
	 * @param taskId 完成的任务ID
	 */
	private onTaskCompleted(taskId: string): void {
		// 清理事件监听器
		const cleanup = this.taskCompletionCallbacks.get(taskId)
		if (cleanup) {
			cleanup()
			this.taskCompletionCallbacks.delete(taskId)
		}

		// 从活跃任务中移除
		this.activeTasks.delete(taskId)
		this.log(`Task ${taskId} completed (${this.activeTasks.size}/${this.maxConcurrentTasks} active tasks)`)

		// 释放该任务持有的所有资源锁
		this.releaseTaskLocks(taskId)

		// 检查是否有等待的任务可以启动
		this.processQueue()
	}

	/**
	 * 处理等待队列
	 */
	private processQueue(): void {
		// 当有可用并发槽位且队列不为空时
		while (this.activeTasks.size < this.maxConcurrentTasks && this.taskQueue.length > 0) {
			const nextTask = this.taskQueue.shift()
			if (nextTask) {
				this.startTask(nextTask).catch((error) => {
					this.log(`Failed to start queued task ${nextTask.taskId}: ${error}`)
				})
			}
		}
	}

	/**
	 * 获取活跃任务列表
	 */
	getActiveTasks(): Task[] {
		return Array.from(this.activeTasks.values())
	}

	/**
	 * 获取等待队列
	 */
	getQueuedTasks(): Task[] {
		return [...this.taskQueue]
	}

	/**
	 * 获取任务状态
	 * @param taskId 任务ID
	 */
	getTaskStatus(taskId: string): "active" | "queued" | "not-found" {
		if (this.activeTasks.has(taskId)) {
			return "active"
		}
		if (this.taskQueue.some((task) => task.taskId === taskId)) {
			return "queued"
		}
		return "not-found"
	}

	/**
	 * 取消任务
	 * @param taskId 要取消的任务ID
	 */
	async cancelTask(taskId: string): Promise<boolean> {
		// 检查是否在活跃任务中
		const task = this.activeTasks.get(taskId)
		if (task) {
			try {
				await task.abortTask(true)
				// 手动触发任务完成处理
				this.onTaskCompleted(taskId)
				return true
			} catch (error) {
				this.log(`Failed to cancel active task ${taskId}: ${error}`)
				return false
			}
		}

		// 检查是否在队列中
		const queueIndex = this.taskQueue.findIndex((t) => t.taskId === taskId)
		if (queueIndex !== -1) {
			this.taskQueue.splice(queueIndex, 1)
			this.log(`Task ${taskId} removed from queue`)
			return true
		}

		return false
	}

	/**
	 * 设置最大并发数
	 * @param max 新的最大并发数
	 */
	setMaxConcurrentTasks(max: number): void {
		if (max < 1) {
			throw new Error("Max concurrent tasks must be at least 1")
		}

		this.maxConcurrentTasks = max
		this.log(`Max concurrent tasks set to ${max}`)

		// 如果增加了并发数，处理队列中的任务
		if (max > this.activeTasks.size) {
			this.processQueue()
		}
	}

	/**
	 * 获取当前并发统计
	 */
	getStats() {
		return {
			maxConcurrentTasks: this.maxConcurrentTasks,
			activeTasks: this.activeTasks.size,
			queuedTasks: this.taskQueue.length,
			totalTasks: this.activeTasks.size + this.taskQueue.length,
		}
	}

	/**
	 * 获取资源锁
	 * @param resourceId 资源ID
	 * @param taskId 请求锁的任务ID
	 * @returns 是否成功获取锁
	 */
	acquireResourceLock(resourceId: string, taskId: string): boolean {
		const currentOwner = this.resourceLocks.get(resourceId)
		if (currentOwner && currentOwner !== taskId) {
			return false // 资源已被其他任务锁定
		}

		this.resourceLocks.set(resourceId, taskId)
		return true
	}

	/**
	 * 释放资源锁
	 * @param resourceId 资源ID
	 * @param taskId 任务ID
	 */
	releaseResourceLock(resourceId: string, taskId: string): void {
		const currentOwner = this.resourceLocks.get(resourceId)
		if (currentOwner === taskId) {
			this.resourceLocks.delete(resourceId)
		}
	}

	/**
	 * 释放任务持有的所有资源锁
	 * @param taskId 任务ID
	 */
	private releaseTaskLocks(taskId: string): void {
		for (const [resourceId, ownerTaskId] of this.resourceLocks.entries()) {
			if (ownerTaskId === taskId) {
				this.resourceLocks.delete(resourceId)
			}
		}
	}

	/**
	 * 日志记录
	 * @param message 日志消息
	 */
	private log(message: string): void {
		console.log(`[TaskScheduler] ${message}`)
	}
}
