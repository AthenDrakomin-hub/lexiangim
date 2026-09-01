//go:build windows

package metrics

import (
	"fmt"
	"syscall"
	"unsafe"
)

var modKernel32 = syscall.NewLazyDLL("kernel32.dll")
var procGlobalMemoryStatusEx = modKernel32.NewProc("GlobalMemoryStatusEx")

type memoryStatusEx struct {
	dwLength                 uint32
	dwMemoryLoad             uint32
	ullTotalPhys             uint64
	ullAvailPhys             uint64
	ullTotalPageFile         uint64
	ullAvailPageFile         uint64
	ullTotalVirtual          uint64
	ullAvailVirtual          uint64
	ullAvailExtendedVirtual  uint64
}

func GetMemoryMetrics() (MemoryMetrics, error) {
	var state memoryStatusEx
	state.dwLength = uint32(unsafe.Sizeof(state))
	r1, _, err := procGlobalMemoryStatusEx.Call(uintptr(unsafe.Pointer(&state)))
	if r1 == 0 {
		return MemoryMetrics{}, fmt.Errorf("collect memory metrics: %w", err)
	}

	total := state.ullTotalPhys
	avail := state.ullAvailPhys
	used := total - avail

	// Windows 下 Swap 字段暂不采集，开发环境不影响功能
	return MemoryMetrics{
		TotalBytes:       total,
		UsedBytes:        used,
		FreeBytes:        avail,
		AvailableBytes:   avail,
		UsagePercent:     usagePercent(used, total),
		SwapTotalBytes:   0,
		SwapUsedBytes:    0,
		SwapFreeBytes:    0,
		SwapUsagePercent: 0,
	}, nil
}
